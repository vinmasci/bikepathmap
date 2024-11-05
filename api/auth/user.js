export default function handler(req, res) {
    if (req.isAuthenticated()) {
      res.json({
        user: req.user,
      });
    } else {
      res.json({
        user: null,
      });
    }
  }
  