import React, { useState, useEffect } from 'react';
import CreateProductModal from './CreateProductModal';

const ClientDashboard = ({ currentUser, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const fetchProducts = () => {
    fetch('http://localhost:8080/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error fetching products:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleWishlist = () => {
    if(search) {
      alert(`Palabra clave "${search}" añadida a tu Wishlist.`);
    }
  };

  const handleBuy = async (productId) => {
    if(window.confirm("¿Estás seguro de que quieres comprar este producto?")) {
      const res = await fetch(`http://localhost:8080/api/products/${productId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: currentUser.id })
      });
      if(res.ok) {
        alert("¡Compra realizada con éxito!");
        fetchProducts(); // Recargar productos
      } else {
        alert("Error al realizar la compra.");
      }
    }
  };

  const handleBid = async (productId, currentPrice) => {
    const newBid = prompt(`Precio actual: ${currentPrice}€.\nIntroduce tu nueva puja (debe ser mayor):`);
    if(newBid) {
      if(parseFloat(newBid) <= parseFloat(currentPrice)) {
        alert("La puja debe ser superior al precio actual.");
        return;
      }
      const res = await fetch(`http://localhost:8080/api/products/${productId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newBid, bidderId: currentUser.id.toString() })
      });
      if(res.ok) {
        alert("¡Puja realizada con éxito!");
        fetchProducts(); // Recargar productos
      } else {
        alert("Error al realizar la puja.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {showCreateModal && (
        <CreateProductModal 
          currentUser={currentUser} 
          onClose={() => setShowCreateModal(false)}
          onProductCreated={fetchProducts}
        />
      )}

      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Market C2C</h1>
          <p className="text-gray-500 text-sm">Hola, <span className="font-semibold text-blue-600">@{currentUser.username}</span></p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
          >
            + Publicar Anuncio
          </button>
          <button 
            onClick={onLogout}
            className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-lg shadow-sm hover:bg-gray-900 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Búsqueda y Filtros */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-8 flex gap-4 items-center">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg bg-white outline-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las Categorías</option>
          <option value="electronics">Electrónica</option>
          <option value="fashion">Moda</option>
        </select>
        <button className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
          Buscar
        </button>
      </section>

      {/* Grid de Productos */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition group">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center overflow-hidden">
               {product.imageUrl ? (
                 <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-gray-400 font-medium">Sin Imagen</span>
               )}
               <span className={`absolute top-2 right-2 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm ${product.saleType === 'AUCTION' ? 'bg-red-500' : 'bg-green-500'}`}>
                 {product.saleType === 'AUCTION' ? 'SUBASTA' : 'COMPRA DIRECTA'}
               </span>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900 truncate">{product.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.condition === 'NEW' ? 'Estado: Nuevo' : 'Estado: Usado'}</p>
              
              <div className="mt-5 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{product.saleType === 'AUCTION' ? 'Puja Actual' : 'Precio Fijo'}</p>
                  <p className={`text-2xl font-black ${product.saleType === 'AUCTION' ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.currentPrice} €
                  </p>
                </div>
                {product.saleType === 'AUCTION' && product.status === 'ACTIVE' && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                    ⏳ ACTIVA
                  </p>
                )}
                {product.status === 'SOLD' && (
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    🔒 VENDIDO
                  </p>
                )}
              </div>
              
              {product.status === 'ACTIVE' ? (
                <button 
                  onClick={() => product.saleType === 'AUCTION' ? handleBid(product.id, product.currentPrice) : handleBuy(product.id)}
                  className={`mt-5 w-full py-2.5 rounded-lg font-bold transition shadow-sm ${product.saleType === 'AUCTION' ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {product.saleType === 'AUCTION' ? 'Hacer Puja' : 'Comprar Ahora'}
                </button>
              ) : (
                <button disabled className="mt-5 w-full py-2.5 rounded-lg font-bold bg-gray-200 text-gray-500 cursor-not-allowed">
                  No Disponible
                </button>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-full text-center text-gray-500 py-10 font-medium text-lg">Aún no hay productos en la plataforma.</p>}
      </section>
    </div>
  );
};

export default ClientDashboard;
