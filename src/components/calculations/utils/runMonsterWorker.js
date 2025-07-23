export function runMonsterWorker(context, cycles = 200) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/monster-worker.js', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            resolve(e.data);
            worker.terminate();
        };

        worker.onerror = (err) => {
            reject(err);
            worker.terminate();
        };

        worker.postMessage({ context, cycles });
    });
}
