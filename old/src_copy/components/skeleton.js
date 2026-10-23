import React from 'react';

class Component extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<div className="Skeleton" style={{...this.props}}></div>)
	};
};
export default Component;