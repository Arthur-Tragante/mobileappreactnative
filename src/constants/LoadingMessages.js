export default {
    getRandomLoadingMessage() {
        let loadingMessages = [
            'Carregando configurações do ambiente...',
            'Sincronizando suas informações...',
            'Carregando dashboard...'
        ];

        let randomIndex = Math.floor(Math.random() * loadingMessages.length);
        return loadingMessages[randomIndex];
    }
}