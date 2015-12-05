'use strict';

export default function(dateString) {
  return dateString.toString().replace(/-/g, '/').replace(/(\d)T(\d)/, '$1 $2');
};
