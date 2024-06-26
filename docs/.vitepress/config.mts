import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "pomelo",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        siteTitle: "pomelo",
        nav: [
            { text: "指南", link: "/introduction" },
            // { text: "API", link: "/API" },
        ], search: {
            provider: 'local'
        },
        sidebar: [{
            text: 'pomelo 简介', link: '/introduction'
            
        },
        {
            text: '快速上手', link: '/startup'
            
        }, {
            text: '配置文件',link: '/config'
            
        }
        ],

        // sidebar: [
        //   {
        //     text: 'Examples',
        //     items: [
        //       { text: 'Markdown Examples', link: '/markdown-examples' },
        //       { text: 'Runtime API Examples', link: '/api-examples' }
        //     ]
        //   }
        // ],

        socialLinks: [
            { icon: "github", link: "https://github.com/pomelo-js/pomelo" },
        ],
    },
});
