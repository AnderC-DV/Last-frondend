import React from 'react';

const WelcomeHeader = ({ name }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-800">Bienvenido de vuelta, {name}</h1>
      <p className="text-gray-500">Aquí tienes un resumen de tu actividad y herramientas principales</p>
    </div>
  );
};

export default WelcomeHeader;
