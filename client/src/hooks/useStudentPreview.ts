import { Typography } from "antd";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { toTitleCase } from "../utils/string/toTitleCase";

const { Text } = Typography;

type RowIn = Record<string, any> & {
  nombres: string;
  apellidos: string;
  codigo: number | string;
};
interface UseStudentPreviewProps {
  data: RowIn[];
  duplicates: string[];
}
interface UseStudentPreviewReturn {
  dupSet: Set<string>;
  hasCorreo: boolean;
  extraCols: string[];
  columns: ColumnsType<RowIn>;
}


export const useStudentPreview = ({
    data, 
    duplicates, 
}: UseStudentPreviewProps): UseStudentPreviewReturn => {
    const dupSet = useMemo(() => 
        new Set(duplicates.map((d) => String(d).trim().toLowerCase())), 
        [duplicates]
    );
    const hasCorreo = useMemo(() => 
        data.some((r) => 'correo' in r && String(r.correo || '').trim() !== ''), 
        [data]
    );
    const extraCols = useMemo(()=> {
        const coreKeys = new Set(['nombres', 'apellidos', 'codigo', 'correo']);
        const extraColumnsSet = data.reduce<Set<string>>((acc, row) => {
            Object.keys(row).forEach((k) => {
                const nk = k.trim();
                if (!coreKeys.has(nk)) acc.add(nk);
            });
            return acc;
        }, new Set<string>());
        return Array.from(extraColumnsSet);
    }, [data]);

    const columns: ColumnsType<RowIn> = useMemo(() =>{
        const baseColumns: ColumnsType<RowIn> = [
            {
                title: 'Código',
                dataIndex: 'codigo',
                key: 'codigo',
                render: (v: any) =>
                dupSet.has(String(v || '').trim().toLowerCase())
                    ? React.createElement(Text, { type: "danger" }, `${String(v)} (duplicado)`) 
                    : React.createElement(Text, {}, String(v)), 
                width: 100,
            },
            { 
                title: 'Nombre', 
                dataIndex: 'nombres', 
                key: 'nombres', 
                render: (v: any) => React.createElement(Text, {}, toTitleCase(v)) 
            },
            { 
                title: 'Apellido', 
                dataIndex: 'apellidos', 
                key: 'apellidos', 
                render: (v: any) => React.createElement(Text, {}, toTitleCase(v))
            },
        ];
        if (hasCorreo) {
            baseColumns.push({ 
                title: 'Correo', 
                dataIndex: 'correo', 
                key: 'correo' 
            } as const);
        }
        const additionalColumns = extraCols.map((k) => ({
            title: k,
            dataIndex: k,
            key: k,
        }));
        return [...baseColumns, ...additionalColumns];
    }, [dupSet, hasCorreo, extraCols]);

    return {
        dupSet,
        hasCorreo,
        extraCols,
        columns,
    };
};