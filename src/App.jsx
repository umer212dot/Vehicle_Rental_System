import React from 'react';
import TestDbConnection from './components/TestDbConnection';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Vehicle Rental System</h1>
      </header>
      <main>
        <TestDbConnection />
      </main>
    </div>
  );
}

export default App; 