import React, { useState } from 'react';

const ModeratorPanel = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('alerts'); // alerts, reports, users

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col h-screen sticky top-0">
        <h2 className="text-xl font-bold text-white mb-8">🛡️ Moderación C2C</h2>
        <nav className="flex flex-col gap-2 flex-1">
          <button 
            className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'alerts' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setActiveTab('alerts')}
          >
            ⚠️ Alertas de Inflación
          </button>
          <button 
            className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setActiveTab('reports')}
          >
            🚩 Anuncios Reportados
          </button>
          <button 
            className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Gestión de Usuarios
          </button>
        </nav>
        <div className="pt-4 border-t border-gray-700 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-bold">
              {currentUser?.username?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <p className="text-sm font-semibold">@{currentUser?.username}</p>
              <p className="text-xs text-gray-400">Panel de Control</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Panel de Moderación</h1>
          <p className="text-gray-400 mt-2">Revisa las alertas automáticas y reportes de la comunidad.</p>
        </header>

        {activeTab === 'alerts' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Inteligencia Artificial: Alertas de Precios</h3>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold border border-red-500/50">
                2 Nuevas Alertas
              </span>
            </div>
            
            <div className="grid gap-4">
              {/* Alert Card Mock */}
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">📷</div>
                  <div>
                    <h4 className="font-bold text-lg">PlayStation 5 Pro</h4>
                    <p className="text-sm text-gray-400">Vendedor: <span className="text-blue-400 cursor-pointer">@user_scalper</span></p>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className="text-sm bg-gray-700 px-2 py-1 rounded">Precio Original: €499</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-sm font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded">Precio de Venta: €1,200 (+140%)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
                    Eliminar Anuncio
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">
                    Ignorar Alerta
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reports' && (
          <section>
             <h3 className="text-xl font-semibold mb-6">Reportes de Usuarios</h3>
             <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
               <table className="w-full text-left">
                 <thead className="bg-gray-700/50 border-b border-gray-700">
                   <tr>
                     <th className="p-4 font-semibold text-gray-300">ID Producto</th>
                     <th className="p-4 font-semibold text-gray-300">Razón del Reporte</th>
                     <th className="p-4 font-semibold text-gray-300">Reportes Totales</th>
                     <th className="p-4 font-semibold text-gray-300">Acción</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="border-b border-gray-700/50 hover:bg-gray-700/20">
                     <td className="p-4 text-blue-400 cursor-pointer">#PRD-9821</td>
                     <td className="p-4">Contenido inapropiado en imágenes</td>
                     <td className="p-4"><span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-bold">5 Reportes</span></td>
                     <td className="p-4">
                        <button className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded mr-2">Revisar</button>
                        <button className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded">Suspender</button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ModeratorPanel;
