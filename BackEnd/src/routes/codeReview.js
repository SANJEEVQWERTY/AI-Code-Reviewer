const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Protected route for code review
router.post('/get-review', auth, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Please provide code to review' });
        }

        // Here you would typically call your AI service
        // For now, we'll return a sample response
        const review = {
            summary: "Code Review Summary",
            issues: [
                {
                    type: "warning",
                    message: "Function 'sum' is defined but never used",
                    line: 1
                },
                {
                    type: "error",
                    message: "Variable 'a' and 'b' are not defined",
                    line: 2
                }
            ],
            suggestions: [
                "Define the variables 'a' and 'b' before using them",
                "Consider adding type hints for better code clarity",
                "Add docstring to explain the function's purpose"
            ]
        };

        res.json(review);
    } catch (error) {
        console.error('Code review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 