import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { firestoreDb } from './firestoreDb';


export const reportGenerator = {
    async generateGeneralReport() {
        // Fetch all data
        const [units, programs, actions] = await Promise.all([
            firestoreDb.getUnits(),
            firestoreDb.getPrograms(),
            firestoreDb.getAllActions()
        ]);

        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Relatório de Execução Estratégica", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);

        doc.setDrawColor(200, 200, 200);
        doc.line(14, 32, 196, 32);

        let yPos = 40;

        // --- Content by Unit ---
        for (const unit of units) {
            const unitPrograms = programs.filter(p => p.unitId === unit.id);

            if (unitPrograms.length === 0) continue;

            // Unit Header
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos - 6, 182, 10, 'F');
            doc.text(`${unit.acronym} - ${unit.name}`, 16, yPos);
            yPos += 15;

            for (const prog of unitPrograms) {
                const progActions = actions.filter(a => a.programId === prog.id);
                // Program Subheader
                doc.setFontSize(12);
                doc.setTextColor(50, 50, 150);
                doc.text(`Programa: ${prog.name}`, 14, yPos);
                yPos += 8;

                if (progActions.length > 0) {
                    const tableBody = progActions.map(action => [
                        action.name,
                        action.responsible,
                        action.endDate ? new Date(action.endDate).toLocaleDateString('pt-BR') : '-',
                        translateStatus(action.status)
                    ]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [['Ação', 'Responsável', 'Prazo', 'Status']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [66, 133, 244] },
                        styles: { fontSize: 9 },
                        columnStyles: {
                            0: { cellWidth: 80 },
                            3: { cellWidth: 30, fontStyle: 'bold' }
                        },
                        didParseCell: (data) => {
                            if (data.section === 'body' && data.column.index === 3) {
                                const status = progActions[data.row.index].status;
                                if (status === 'completed') data.cell.styles.textColor = [34, 197, 94];
                                if (status === 'delayed') data.cell.styles.textColor = [239, 68, 68];
                                if (status === 'in_progress') data.cell.styles.textColor = [59, 130, 246];
                            }
                        }
                    });

                    // Update Y Position after table
                    yPos = (doc as any).lastAutoTable.finalY + 15;
                } else {
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.text("(Sem ações cadastradas)", 14, yPos);
                    yPos += 15;
                }

                // Page break check (rough)
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            }
            yPos += 10;
        }

        doc.save("relatorio-estrategico.pdf");
    },

    async generateExcelReport() {
        const [units, programs, actions, indicators, deliverables] = await Promise.all([
            firestoreDb.getUnits(),
            firestoreDb.getPrograms(),
            firestoreDb.getAllActions(),
            firestoreDb.getAllIndicators(),
            firestoreDb.getAllDeliverables()
        ]);

        const wb = XLSX.utils.book_new();

        // 1. Actions Sheet
        const actionsData = actions.map(action => {
            const program = programs.find(p => p.id === action.programId);
            const unit = units.find(u => u.id === program?.unitId);
            return {
                'Unidade Sigla': unit?.acronym || '-',
                'Unidade Nome': unit?.name || '-',
                'Programa': program?.name || '-',
                'Ação': action.name,
                'Responsável': action.responsible,
                'Início': action.startDate,
                'Fim': action.endDate,
                'Status': translateStatus(action.status),
                'Peso': action.weight
            };
        });
        const actionsSheet = XLSX.utils.json_to_sheet(actionsData);
        XLSX.utils.book_append_sheet(wb, actionsSheet, "Acoes");

        // 2. Indicators Sheet
        const indicatorsData = indicators.map(ind => {
            const program = programs.find(p => p.id === ind.programId);
            const unit = units.find(u => u.id === program?.unitId);
            return {
                'Unidade': unit?.acronym || '-',
                'Programa': program?.name || '-',
                'Indicador': ind.name,
                'Linha de Base': ind.baseline,
                'Meta': ind.target,
                'Unidade de Medida': ind.unit
            };
        });
        const indicatorsSheet = XLSX.utils.json_to_sheet(indicatorsData);
        XLSX.utils.book_append_sheet(wb, indicatorsSheet, "Indicadores");

        // 3. Deliverables Sheet
        const deliverablesData = deliverables.map(del => {
            const action = actions.find(a => a.id === del.actionId);
            const program = programs.find(p => p.id === action?.programId);
            const unit = units.find(u => u.id === program?.unitId);
            return {
                'Unidade': unit?.acronym || '-',
                'Programa': program?.name || '-',
                'Ação': action?.name || '-',
                'Entregável': del.description,
                'Data': del.date,
                'Quantidade': del.quantity,
                'Unidade Medida': del.unit
            };
        });
        const deliverablesSheet = XLSX.utils.json_to_sheet(deliverablesData);
        XLSX.utils.book_append_sheet(wb, deliverablesSheet, "Entregaveis");

        // Save file
        XLSX.writeFile(wb, `base_dados_estrategica_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
};

function translateStatus(status: string) {
    const map: Record<string, string> = {
        'not_started': 'Não Iniciada',
        'in_progress': 'Em Andamento',
        'delayed': 'Atrasada',
        'completed': 'Concluída'
    };
    return map[status] || status;
}
