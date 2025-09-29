import React from 'react';
    import Header from '@/components/layout/Header';
    import Footer from '@/components/layout/Footer';

    const Layout = ({ children }) => {
      return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </div>
      );
    };

    export default Layout;