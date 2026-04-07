const express = require("express");
const Todo = require("../models/Todo");
const mongoose = require("mongoose");

const router = express.Router();

// GET /todos
router.get("/", async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    return res.json({ ok: true, data: todos });
  } catch (_err) {
    return res.status(500).json({ ok: false, message: "internal error" });
  }
});

// POST /todos
router.post("/", async (req, res) => {
  try {
    const { title, dueDate } = req.body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ ok: false, message: "title is required" });
    }

    const todo = await Todo.create({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    return res.status(201).json({ ok: true, data: todo });
  } catch (_err) {
    return res.status(500).json({ ok: false, message: "internal error" });
  }
});

// PATCH /todos/:id
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "invalid id" });
    }

    const { title, done, dueDate } = req.body ?? {};

    const update = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res
          .status(400)
          .json({ ok: false, message: "title must be a non-empty string" });
      }
      update.title = title.trim();
    }

    if (done !== undefined) {
      if (typeof done !== "boolean") {
        return res
          .status(400)
          .json({ ok: false, message: "done must be boolean" });
      }
      update.done = done;
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        update.dueDate = null;
      } else {
        const parsed = new Date(dueDate);
        if (Number.isNaN(parsed.getTime())) {
          return res
            .status(400)
            .json({ ok: false, message: "dueDate must be a valid date" });
        }
        update.dueDate = parsed;
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "at least one of title/done/dueDate is required",
      });
    }

    const todo = await Todo.findByIdAndUpdate(id, update, { new: true });
    if (!todo) {
      return res.status(404).json({ ok: false, message: "not found" });
    }

    return res.json({ ok: true, data: todo });
  } catch (_err) {
    return res.status(500).json({ ok: false, message: "internal error" });
  }
});

// DELETE /todos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "invalid id" });
    }

    const deleted = await Todo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "not found" });
    }

    return res.json({ ok: true });
  } catch (_err) {
    return res.status(500).json({ ok: false, message: "internal error" });
  }
});

module.exports = router;

