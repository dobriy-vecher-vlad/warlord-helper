import { Card, SimpleCell, Tappable } from '@vkontakte/vkui';
import React from 'react';

export const RichCardAvatar = (props) => {
	let {
		images = [], // String, Array, false
		alt = 'Open link', // String
	} = props || {};
	if (typeof images == 'string') images = [images];

	const Container = (props) => images.length > 1 ? <div className="RichCardAvatarGrid">{props.children}</div> : props.children;
	return (<Container>
		{images.map((image, key) => <div key={key} className="RichCardAvatar" role="img">{typeof image == 'object' ? image : <div className={image.includes('items/') || image.includes('collections/') ? 'AvatarItem' : ''}><img src={image} alt={alt}/></div>}</div>)}
	</Container>)
};
export const RichCard = (props) => {
	const {
		avatar = [], // String, Array, false
		href = false, // String, false
		target = '_blank', // _blank, _self, _parent, _top
		title = 'Open link', // String
		text = 'Open link', // String
		className = false,
		onClick = () => {},
	} = props || {};
	const classNames = (classNames) => Object.keys(classNames).filter((className, key) => Object.values(classNames)[key] == true).join(' ');
	const Container = (props) => href ? <a href={href} target={target} title={title} {...props}>{props.children}</a> : <button {...props}>{props.children}</button>;
	return (<React.Fragment>
		<Card className={classNames({
				[className]: className ? true : false,
				[`RichCard`]: true,
			})} onClick={onClick}>
			<Container>
				{(title || text) && <div className={classNames({
					[`RichCard__content`]: true,
					[`RichCard__content--shadow`]: typeof avatar == 'string',
				})}>
					{title && <div className="RichCard__content-title">{title}</div>}
					{text && <div className="RichCard__content-text">{text}</div>}
				</div>}
				{avatar && <div className={classNames({
					[`RichCard__avatar`]: typeof avatar != 'string',
					[`RichCard__image`]: typeof avatar == 'string',
				})}><RichCardAvatar images={avatar} alt={title}/></div>}
				<div className="RichCard__placeholder"><Tappable/></div>
			</Container>
		</Card>
	</React.Fragment>)
};