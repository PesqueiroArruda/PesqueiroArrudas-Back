class IfoodController {
  async store(req, res) {
    console.log('Novo pedido recebido:', req.body);

    res.status(200).send('Recebido com sucesso');
  }
}

module.exports = new IfoodController();
