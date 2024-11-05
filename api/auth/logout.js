// api/auth/logout.js
export default function handler(req, res) {
    // Simply return a success message as JWTs do not require session management
    res.status(200).json({ message: "Logged out successfully" });
}
