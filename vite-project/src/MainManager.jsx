import React, { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import Menu from './Menu.jsx'
import PageOne from './PageOne.jsx';
import PageTwo from './PageTwo.jsx';


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
    </>
  );
};

export default MainManager;
