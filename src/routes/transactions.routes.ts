import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';

// importa o service
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.AllTransactions();
  response.json(transactions);
});

transactionsRouter.get('/balance', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const getBalance = await transactionsRepository.getBalance();
  response.json(getBalance);
});

transactionsRouter.post('/', async (request, response) => {
  // pego a requisção
  const { title, value, type, category } = request.body;
  // cria instancia do create Service
  const createTransaction = new CreateTransactionService();
  // agora podemos chamar o metodo execute
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });
  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const id = request.param('id');
  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({ id });
  return response.status(204).send('');
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();

    const transactions = await importTransactions.execute(request.file.path);

    return response.json(transactions);
  },
);

export default transactionsRouter;
