import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { InterviewQuestion, MultipleSelectionResponse, DoubleOptionResponse } from '../interfaces/interviewInt';

export const usePdfGenerator = () => {
  const generatePDF = async (data: InterviewQuestion[]): Promise<void> => {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '210mm';
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        
        tempDiv.innerHTML = `
          <h3 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">
            Resultados de entrevista
          </h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 10px;">
            <div style="padding: 15px; text-align: center; font-weight: bold; background-color: #3498db; color: white; border-right: 1px solid #2980b9; border-bottom: 2px solid #2980b9;">
                Pregunta
            </div>
            <div style="padding: 15px; text-align: center; font-weight: bold; background-color: #3498db; color: white; border-right: 1px solid #2980b9; border-bottom: 2px solid #2980b9;">
                Estado
            </div>
            <div style="padding: 15px; text-align: center; font-weight: bold; background-color: #3498db; color: white; border-right: 1px solid #2980b9; border-bottom: 2px solid #2980b9;">
                Explicación
            </div>
            ${renderQuestions(data)}
          </div>
          ${renderSummary(data)}
        `;

        document.body.appendChild(tempDiv);
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        document.body.removeChild(tempDiv);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const margin = 10;
        const contentWidth = pdfWidth - (margin * 2);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const totalPages = Math.ceil(imgHeight / pdfHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();
          const yPosition = -(i * pdfHeight) + margin;
          
          pdf.addImage(
            canvas.toDataURL('image/png'), 
            'PNG', 
            margin, 
            yPosition, 
            imgWidth, 
            imgHeight
          );
        }

        pdf.save('resultados-entrevista-completo.pdf');

      } catch (error) {
        console.error('Error al generar PDF:', error);
        throw error;
      }
  };

  // Función para renderizar las preguntas en formato de tabla
  const renderQuestions = (data: InterviewQuestion[]): string => {
    return data.map((item, index) => {
      if (isMultipleSelection(item)) {
        return renderMultipleSelectionQuestion(item, index);
      } else if (isDoubleOption(item)) {
        return renderDoubleOptionQuestion(item, index);
      }
      return '';
    }).join('');
  };

  // Type guards para identificar el tipo de pregunta
  const isMultipleSelection = (item: InterviewQuestion): item is MultipleSelectionResponse => {
    return Array.isArray((item as MultipleSelectionResponse).options) && 
           typeof (item as MultipleSelectionResponse).options[0] === 'string';
  };

  const isDoubleOption = (item: InterviewQuestion): item is DoubleOptionResponse => {
    return Array.isArray((item as DoubleOptionResponse).options) && 
           typeof (item as DoubleOptionResponse).options[0] === 'object' &&
           'label' in (item as DoubleOptionResponse).options[0];
  };

  // Renderizar pregunta de selección múltiple en formato de tabla
  const renderMultipleSelectionQuestion = (item: MultipleSelectionResponse, index: number): string => {
    return `
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">
        ${index + 1}: ${item.question}
      </div>  
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">
        ${item.options.map((option, optIndex) => {
          let style = '';
          if (item.givenAnswer !== undefined && item.givenAnswer === optIndex && item.correctAnswer === optIndex) {
            style = 'color: #27ae60; font-weight: bold;';
          } else if (item.givenAnswer !== undefined && item.givenAnswer === optIndex && item.correctAnswer !== optIndex) {
            style = 'color: #e74c3c; text-decoration: line-through;';
          } else if (item.correctAnswer === optIndex) {
            style = 'color: #27ae60; font-weight: bold;';
          }
          return `
            <div style="margin: 5px 0; ${style}">
              ${String.fromCharCode(65 + optIndex)}. ${option}
            </div>
          `;
        }).join('')}
        <div style="margin-top: 5px; font-weight: bold; 
                    color: ${item.givenAnswer !== undefined && item.givenAnswer === item.correctAnswer ? '#27ae60' : '#e74c3c'};">
              ${item.givenAnswer !== undefined && item.givenAnswer === item.correctAnswer 
            ? '✓ Respuesta correcta' 
            : item.givenAnswer !== undefined 
              ? '✗ Respuesta incorrecta'
              : 'No respondida'}
        </div>  
      </div>
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; font-style: italic;">
        ${item.explanation}
      </div>
    `;
  };

  // Renderizar pregunta de doble opción en formato de tabla
  const renderDoubleOptionQuestion = (item: DoubleOptionResponse, index: number): string => {
    return `
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">
        ${index + 1}: ${item.question}
      </div>  
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">
        ${item.options.map((option, optIndex) => {
          let style = '';
          if (item.givenAnswer !== undefined && item.givenAnswer === optIndex && item.correctAnswer === optIndex) {
            style = 'color: #27ae60; font-weight: bold;';
          } else if (item.givenAnswer !== undefined && item.givenAnswer === optIndex && item.correctAnswer !== optIndex) {
            style = 'color: #e74c3c; text-decoration: line-through;';
          } else if (item.correctAnswer === optIndex) {
            style = 'color: #27ae60; font-weight: bold;';
          }
          return `
            <div style="margin: 5px 0; ${style}">
              ${option.label}: ${option.answer}
            </div>
          `;
        }).join('')}
        <div style="margin-top: 5px; font-weight: bold; 
                    color: ${item.givenAnswer !== undefined && item.givenAnswer === item.correctAnswer ? '#27ae60' : '#e74c3c'};">
              ${item.givenAnswer !== undefined && item.givenAnswer === item.correctAnswer 
            ? '✓ Respuesta correcta' 
            : item.givenAnswer !== undefined 
              ? '✗ Respuesta incorrecta'
              : 'No respondida'}
        </div>  
      </div>
      <div style="padding: 12px; border-bottom: 1px solid #ecf0f1; font-style: italic;">
        ${item.explanation}
      </div>
    `;
  };

  // Función para renderizar el resumen
  const renderSummary = (data: InterviewQuestion[]): string => {
    const correctAnswers = data.filter(item => 
      item.givenAnswer !== undefined && item.givenAnswer === item.correctAnswer
    ).length;
    
    const totalQuestions = data.length;
    const percentage = (correctAnswers / totalQuestions * 100).toFixed(2);
    
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #bdc3c7;">
        <h3 style="color: #2c3e50;">Resumen de resultados:</h3>
        <p>Correctas: ${correctAnswers} / ${totalQuestions}</p>
        <p>Porcentaje: ${percentage}%</p>
      </div>
    `;
  };

  return { generatePDF };
};