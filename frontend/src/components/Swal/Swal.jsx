'use client';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showSwal = (ComponentToRender, swalOptions = {}) => {
  MySwal.fire({
    ...swalOptions,
    html: <ComponentToRender />,
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: 'swal2-react-popup'
    },
    showClass: {
      popup: 'animate__animated animate__fadeIn'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    },
  });
};