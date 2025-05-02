const aiService = require("../services/ai.services")

module.exports.getResponse = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Code is required" });
        }

        const review = await aiService(code);
        res.json({ review });
    } catch (error) {
        console.error('AI Review Error:', error);
        res.status(500).json({ message: 'Error generating review' });
    }
}