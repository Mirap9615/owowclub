import React, { useState } from 'react';
import Menu from './Menu.jsx'
import PageOne from './PageOne.jsx';
import PageTwo from './PageTwo.jsx';
import PageThree from './PageThree.jsx';


const MainManager = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const handleChangeIndex = (index) => {
    setPageIndex(index);
  };

  return (
    <>
      <Menu />
      <PageOne />
      <PageTwo />
      <PageThree />
    </>
  );
};

export default MainManager;
