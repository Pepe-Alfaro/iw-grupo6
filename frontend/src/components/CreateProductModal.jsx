import React, { useState } from 'react';

const CreateProductModal = ({ currentUser, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition: 'NEW',
    saleType: 'FIXED_PRICE',
    basePrice: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productPayload = {
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      currentPrice: parseFloat(formData.basePrice),
      seller: { id: currentUser.id }
    };

    if(formData.saleType === 'AUCTION') {
        const end = new Date();
        end.setDate(end.getDate() + 3); // Subasta dura 3 días
        productPayload.endTime = end.toISOString();
    }

    try {
      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      
      if (response.ok) {
        onProductCreated();
        onClose();
      } else {
        alert("Error creando producto en el servidor");
      }
    } catch (err) {
      alert("Error de conexión con el backend");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Publicar Nuevo Anuncio</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea required rows="3" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="NEW">Nuevo</option>
                <option value="USED">Usado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Venta</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.saleType} onChange={e => setFormData({...formData, saleType: e.target.value})}>
                <option value="FIXED_PRICE">Precio Fijo</option>
                <option value="AUCTION">Subasta (3 días)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base (€)</label>
            <input type="number" required min="1" step="0.01" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md">
              Publicar Anuncio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
