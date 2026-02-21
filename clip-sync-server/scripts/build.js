const esbuild = require('esbuild');
const { join } = require('path');

async function build() {
  console.log('🚀 Starting production build...');
  const start = Date.now();

  try {
    await esbuild.build({
      entryPoints: [join(__dirname, '../src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: join(__dirname, '../dist/index.js'),
      minify: true,
      sourcemap: true,
      external: [
        'express',
        'pg',
        '@supabase/supabase-js',
        'stripe',
        'jsonwebtoken',
        'helmet',
        'cors',
        'winston',
        'zod',
        'dotenv'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      logLevel: 'info',
    });

    const duration = Date.now() - start;
    console.log(`✨ Build completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
