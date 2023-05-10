import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

function CustomFooterTotalComponent(props) {
  return (
    <Box sx={{ padding: "10px", display: "flex" }}>
        <Typography>합계 :</Typography>  
        <Typography sx={{ml:7}}>{props.stocktotal}</Typography>
        <Typography sx={{ml:8}}>{props.requiretotal}</Typography>
        
    </Box>
  );
}

CustomFooterTotalComponent.propTypes = {
  total: PropTypes.number
};

export { CustomFooterTotalComponent };