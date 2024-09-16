import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

var local_url = null;
async function getUrl() {
    if (!local_url) {
        local_url = String(process.env.URL_STORAGE);
    }
    return String(local_url);
}

async function upload(url, arqName) {
    if (!url) {
        url = await getUrl();
    }

    const form = new FormData();
    form.append('arquivo', fs.createReadStream(arqName), {
        filename: arqName.split('/').pop(),
        contentType: 'multipart/form-data',
    });

    console.log("url", url);
    try {
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 50000, // 50 seconds timeout

        });
        return response.data;
    } catch (error) {
        console.error('Error encountered during POST:', error.message);
        return '';
    }
}

const TStorage = {
    upload,
}

export { TStorage };