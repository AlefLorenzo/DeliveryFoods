const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/login',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`✅ Status Code: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Página de login carregou com sucesso!');
            console.log('✅ Tamanho da resposta:', data.length, 'bytes');

            // Verificar se não há erros node-gyp-build no HTML
            if (data.includes('node-gyp-build') || data.includes('Cannot read properties of undefined')) {
                console.log('❌ ERRO: Ainda há erros node-gyp-build na página!');
                process.exit(1);
            } else {
                console.log('✅ SUCESSO: Nenhum erro node-gyp-build detectado!');
                console.log('✅ Sistema está funcionando corretamente!');
                process.exit(0);
            }
        } else {
            console.log('❌ Erro ao carregar página:', res.statusCode);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Erro na requisição: ${e.message}`);
    process.exit(1);
});

req.end();
