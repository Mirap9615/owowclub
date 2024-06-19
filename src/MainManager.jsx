import React, { useState } from 'react';
import Menu from './Menu.jsx'
import Steamed from './Steamed.jsx'
import PageTwo from './PageTwo.jsx';

const MainManager = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const handleChangeIndex = (index) => {
    setPageIndex(index);
  };

  return (
    <>
      <Steamed />
      <PageTwo />
    </>
  );
};

export default MainManager;
