class AuthController {
  index(req, res) {
    const { accessKey } = req.body;

    if (!accessKey) {
      return res.status(400).json({
        message: 'Uma chave de acesso precisa ser enviada',
        isAuthorized: false,
      });
    }

    const isCorrect = accessKey === process.env.ACCESS_KEY;

    if (!isCorrect) {
      return res.status(401).json({
        message: 'Chave de acesso inválida',
        isAuthorized: false,
      });
    }

    res.json({
      message: 'Autorizado',
      isAuthorized: true,
    });
  }

  accessClosedCashiers(req, res) {
    const { accessKey } = req.body;

    if (!accessKey) {
      return res.status(400).json({
        message: 'Uma chave de acesso precisa ser enviada',
        isAuthorized: false,
      });
    }

    const isCorrect = accessKey === process.env.CLOSED_CASHIERS_ACCESS_KEY;

    if (!isCorrect) {
      return res.status(401).json({
        message: 'Chave de acesso inválida',
        isAuthorized: false,
      });
    }

    res.json({
      message: 'Autorizado',
      isAuthorized: true,
    });
  }
}

module.exports = new AuthController();
