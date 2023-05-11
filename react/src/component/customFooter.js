import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

function CustomFooterTotalComponent(props) {
  return (
    <Box sx={{ padding: "5px", display: "flex" }}>
        <Typography>합계 :</Typography>  
        <Typography sx={{ml:33}}>{props.sales_amts}</Typography>
        <Typography sx={{ml:12}}>{props.margin_amts}</Typography>
    </Box>
  );
}

CustomFooterTotalComponent.propTypes = {
    total: PropTypes.number
};

export { CustomFooterTotalComponent };