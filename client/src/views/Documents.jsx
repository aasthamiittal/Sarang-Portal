import React, { useState, useEffect } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { CloudUpload, Download, Delete, Description } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Documents = () => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/documents', { headers });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocuments();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/${id}/download`, {
        headers,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`http://localhost:5000/api/documents/${id}`, { headers });
        fetchDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Documents</h1>

      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Filename</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Description />
                    <span>{doc.filename}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.mimetype}</TableCell>
                <TableCell>{(doc.size / 1024).toFixed(2)} KB</TableCell>
                <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDownload(doc._id, doc.filename)} color="primary">
                    <Download />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(doc._id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginTop: 16 }}
          />
          <p className="text-sm text-gray-600 mt-2">
            Supported formats: PDF, JPG, PNG, DOC, DOCX
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Documents;