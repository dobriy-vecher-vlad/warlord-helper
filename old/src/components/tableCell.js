import { SimpleCell } from '@vkontakte/vkui';
import React from 'react';

class Component extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<SimpleCell href={this.props.href} target="_blank" className="TableCell">
			<div className="TableCell__content" style={{...this.props.style}}>
				{this.props.count&&<div className="TableCell__row TableCell__row--count"><span>{this.props.count}</span></div>}
				{this.props.avatar&&<div className="TableCell__row TableCell__row--avatar">{this.props.avatar}</div>}
				{this.props.rows&&this.props.rows.map((row, x) => <div key={x} className="TableCell__row" style={{justifyContent: row.right ? 'flex-end' : 'space-between'}}><span>{row.title}</span></div>)}
			</div>
		</SimpleCell>)
	};
};
export default Component;