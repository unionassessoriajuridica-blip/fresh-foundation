import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, FileSpreadsheet, Info } from 'lucide-react';
import { useClienteExcel } from '@/hooks/useClienteExcel';

export const ClienteDataButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { loading, downloadClientesExcel, uploadClientesExcel, downloadTemplateExcel } = useClienteExcel();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await uploadClientesExcel(selectedFile);
    if (success) {
      setShowDialog(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Dados Cadastrais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Gerenciar Dados de Clientes
          </DialogTitle>
          <DialogDescription>
            Faça download ou importe dados cadastrais de clientes via Excel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={downloadClientesExcel}
              disabled={loading}
              className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Gerando...' : 'Baixar Excel'}
            </Button>

            <Button
              variant="outline"
              onClick={downloadTemplateExcel}
              className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
              Template
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Formato do Excel:</p>
                <ul className="text-xs space-y-0.5">
                  <li>• Nome (obrigatório)</li>
                  <li>• Email</li>
                  <li>• Telefone</li>
                  <li>• CPF/CNPJ</li>
                  <li>• Endereço</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Importar Excel:</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? 'Importando...' : 'Importar Excel'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};