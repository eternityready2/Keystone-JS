// admin/pages/CustomHomepage.tsx

import React from 'react';
// Importa os hooks e componentes corretos e exportados pelo Keystone
import { useKeystone } from '@keystone-6/core/admin-ui/context';
import { Link } from '@keystone-6/core/admin-ui/router';

// Importa o seu visualizador de logs que já criamos
import { LogViewer } from '../components/LogViewer';

// Estilos para os cards do dashboard
const cardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e1e1',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '16px',
};

const pageContainerStyle = {
  padding: '24px',
};

// Este é o componente que renderiza a lista de modelos do seu schema
function DashboardItems() {
  // O hook useKeystone() nos dá acesso a todos os metadados da Admin UI
  const { adminMeta } = useKeystone();

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={gridStyle}>
        {Object.values(adminMeta.lists).map(list => (
          <Link key={list.key} href={`/lists/${list.path}`} style={cardStyle}>
            <h3>{list.label}</h3>
            <p>{list.description || 'Gerenciar itens.'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Sua nova página inicial que combina o Dashboard e os Logs
export default function CustomHomepage() {
  return (
    <div style={pageContainerStyle}>
      {/* 1. Renderiza nosso dashboard recriado */}
      <DashboardItems />

      {/* 2. Renderiza seu componente de logs logo abaixo */}
      <LogViewer />
    </div>
  );
}