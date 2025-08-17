class IfoodController {
  async store(req, res) {
    res.status(200).send('Recebido com sucesso');
  }
}

module.exports = new IfoodController();
