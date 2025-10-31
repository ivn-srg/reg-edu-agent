import * as XLSX from 'xlsx';
import type { Message } from '../types';

interface DialogRow {
  turn_number: number;
  role: string;
  content: string;
  model_response: string;
}

export async function exportDialogToExcel(messages: Message[]): Promise<void> {
  // Подготовка данных для экспорта
  const dialogRows: DialogRow[] = [];
  let turnNumber = 1;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    if (message.role === 'user') {
      // Находим следующее сообщение ассистента
      const assistantMessage = messages[i + 1];
      
      dialogRows.push({
        turn_number: turnNumber,
        role: message.role,
        content: message.content,
        model_response: assistantMessage && assistantMessage.role === 'assistant' 
          ? assistantMessage.content 
          : '',
      });
      
      turnNumber++;
    }
  }

  // Создание рабочей книги
  const worksheet = XLSX.utils.json_to_sheet(dialogRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dialog');

  // Генерация имени файла
  const date = new Date().toISOString().split('T')[0];
  
  // Получаем количество существующих файлов в папке
  const fileNumber = await getNextFileNumber();
  const fileName = `dialog_${fileNumber}_${date}.xlsx`;

  // Экспорт файла
  XLSX.writeFile(workbook, fileName);
  
  console.log(`Диалог экспортирован в файл: ${fileName}`);
}

async function getNextFileNumber(): Promise<number> {
  try {
    // В браузере мы не можем напрямую читать файловую систему
    // Поэтому используем простой счетчик из localStorage
    const savedNumber = localStorage.getItem('dialogExportCounter');
    const currentNumber = savedNumber ? parseInt(savedNumber, 10) : 1;
    const nextNumber = currentNumber + 1;
    localStorage.setItem('dialogExportCounter', nextNumber.toString());
    return currentNumber;
  } catch (error) {
    console.error('Ошибка при получении номера файла:', error);
    return 1;
  }
}
