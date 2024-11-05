export default function handler(req, res) {
    req.logout();
    res.redirect('/');
}
//d