const { GoogleGenerativeAI } = require("@google/generative-ai");
const Task = require("../models/taskModel");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateRoadmap = async (req, res) => {
  try {
    const { prompt, timeframe } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const aiPrompt = `
      You are an expert Project Architect.
      Create a project roadmap for the following goal: "${prompt}" in timeframe: "${timeframe || "unspecified"}".
      Generate exactly 8-12 tasks required for this project.
      Return the result ONLY as a JSON array of objects.
      Each object must have these fields:
      - title: (Short string)
      - description: (One sentence string)
      - priority: (One of: "low", "medium", "high")
      - subTasks: (An array of 2-4 strings for sub-steps)
      - deadlineDays: (Integer, representing how many days from now this task should be due)

      Example Output:
      [
        {
          "title": "Define Requirements",
          "description": "Outline the core features and scope.",
          "priority": "high",
          "subTasks": ["Brainstorm features", "Write spec doc"],
          "deadlineDays": 2
        }
      ]
      Return ONLY the raw JSON array. DO NOT include any markdown or commentary.
    `;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    let text = response.text();
    
    // Xử lý chuỗi JSON thông minh hơn (loại bỏ markdown nếu có)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI returned invalid structure");
    }
    const cleanJson = jsonMatch[0];

    try {
      const roadmap = JSON.parse(cleanJson);
      res.json(roadmap);
    } catch (parseError) {
      console.error("AI Output Parse Error:", text);
      res.status(500).json({ message: "AI returned invalid format. Try again.", raw: text });
    }
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createRoadmapTasks = async (req, res) => {
  try {
    const { tasks, teamId } = req.body;
    const userId = req.user.id;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ message: "Tasks array required" });
    }

    const now = new Date();
    const createdTasks = [];

    for (const t of tasks) {
      const deadline = t.deadlineDays ? new Date(now.getTime() + t.deadlineDays * 24 * 60 * 60 * 1000) : null;
      
      const newTask = new Task({
        title: t.title,
        description: t.description,
        priority: t.priority || "medium",
        status: "pending",
        deadline,
        userId,
        teamId: teamId || null,
        subTasks: (t.subTasks || []).map(text => ({ text, completed: false }))
      });

      const saved = await newTask.save();
      createdTasks.push(saved);
      
      // Emit Real-time
      req.app.get("io").emit("taskChange", { action: "create", task: saved });
    }

    res.status(201).json({ 
      message: `Successfully created ${createdTasks.length} roadmap tasks!`, 
      tasks: createdTasks 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
