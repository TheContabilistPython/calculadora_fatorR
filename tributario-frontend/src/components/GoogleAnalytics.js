import { useEffect } from 'react';

const GoogleAnalytics = () => {
  useEffect(() => {
    const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
    
    if (gaId && gaId !== '%REACT_APP_GA_MEASUREMENT_ID%') {
      // Carregar o script do Google Analytics
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      // Inicializar o Google Analytics
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);

      console.log('Google Analytics inicializado com ID:', gaId);
    } else {
      console.warn('Google Analytics não configurado. Defina REACT_APP_GA_MEASUREMENT_ID');
    }
  }, []);

  return null; // Componente sem renderização visual
};

export default GoogleAnalytics;
