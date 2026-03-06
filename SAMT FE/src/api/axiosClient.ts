import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'https://your-api-url.com', // Thay đổi URL này thành URL API của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;