/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, '..');

// Serve static files from the project root
app.use(express.static(projectRoot));

// Fallback for SPA routing: serve index.html for any request that doesn't match a static file.
app.get('*', (req, res) => {
  const indexPath = path.join(projectRoot, 'index.html');
  if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
  } else {
      res.status(404).send('Error: index.html not found.');
  }
});

const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});