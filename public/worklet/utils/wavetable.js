function generateWaveTable() {
  const tableSize = 2048;
  const table = new Float32Array(tableSize);
  const harmonics = 64;
  
  for (let i = 0; i < tableSize; i++) {
    let phase = i / tableSize;
    let value = 0;
    
    for (let h = 1; h <= harmonics; h++) {
      // Band-limited sawtooth formula using sine waves
      value += (2.0 / Math.PI) * (Math.sin(2.0 * Math.PI * phase * h) / h);
    }
    table[i] = value;
  }
  return table;
}