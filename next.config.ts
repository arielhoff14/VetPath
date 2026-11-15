import type {NextConfig} from 'next';
const config:NextConfig={async headers(){return [{source:'/case',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'no-store'}]},{source:'/invite',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'no-store'}]}];}};
export default config;
