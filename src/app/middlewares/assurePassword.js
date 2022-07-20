const assurePassword = (req, res, next) => {
  const { accessKey } = req.body;

  if (!accessKey) {
    return res
      .status(401)
      .json({ message: 'Chave de acesso precisa ser enviada.', reset: false });
  }

  if (accessKey !== process.env.ACCESS_KEY) {
    return res
      .status(401)
      .json({ message: 'Chave de acesso inválida.', reset: false });
  }

  next();
};

module.exports = assurePassword;
