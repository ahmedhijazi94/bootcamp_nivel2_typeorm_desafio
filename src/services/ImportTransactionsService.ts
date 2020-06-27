import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const contactsReadStream = fs.createReadStream(filepath);

    const parsers = csvParse({
      delimiter: ',',
      from_line: 2,
    });

    const parseCsv = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitels = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitels.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = transactionsRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transactions => ({
        title: transactions.title,
        type: transactions.type,
        value: transactions.value,
        category: finalCategories.find(
          category => category.title === transactions.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filepath);

    console.log(finalCategories);
    console.log(transactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
