import {createRouter, createWebHistory} from 'vue-router'
import Home from '@/views/Home'
import EndpointDetails from "@/views/EndpointDetails";
import SuiteDetails from '@/views/SuiteDetails';
import ClientDirectory from '@/views/ClientDirectory';
import ClientStatus from '@/views/ClientStatus';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/clients',
        name: 'ClientDirectory',
        component: ClientDirectory,
    },
    {
        path: '/clients/:client',
        name: 'ClientStatus',
        component: ClientStatus,
    },
    {
        path: '/endpoints/:key',
        name: 'EndpointDetails',
        component: EndpointDetails,
    },
    {
        path: '/suites/:key',
        name: 'SuiteDetails',
        component: SuiteDetails
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

export default router;
