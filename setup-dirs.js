#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Define all directories to create
const directories = [
    'src/types/domain',
    'src/types/api',
    'src/services',
    'src/services/__tests__',
    'src/hooks'
];

console.log('Creating directories...\n');

// Create each directory
directories.forEach(dir => {
    try {
        fs.mkdirSync(dir, { recursive: true });
        console.log('✓ Created: ' + dir);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            console.error('✗ Error creating ' + dir + ':', err.message);
        } else {
            console.log('✓ Exists: ' + dir);
        }
    }
});

console.log('\n--- Directory Structure ---\n');

// Function to recursively list directories
function listDirs(startPath, prefix = '') {
    let hasItems = false;
    try {
        const files = fs.readdirSync(startPath).sort();
        
        files.forEach((file, index) => {
            const filePath = path.join(startPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                hasItems = true;
                const isLast = index === files.length - 1;
                const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
                console.log(currentPrefix + file + '/');
                
                const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                listDirs(filePath, nextPrefix);
            }
        });
    } catch (err) {
        console.error('Error reading directory:', err.message);
    }
    
    return hasItems;
}

console.log('src/');
listDirs('src');

console.log('\n✓ All directories created successfully!');
