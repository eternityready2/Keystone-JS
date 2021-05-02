var keystone = require('keystone');
var uuid = require('uuid');
var Types = keystone.Field.Types;
var { thumbDir, thumbPath, thumbUrl } = require('../settings');

var Channel = new keystone.List('Channel', {
	defaultColumns: 'description, type, age, rating, channelNumber, categories',
	searchFields: 'title, desctiption',
});

var storage = new keystone.Storage({
	adapter: keystone.Storage.Adapters.FS,
	fs: {
		path: thumbDir,
		publicPath: thumbPath,
	},
});

Channel.add({
	title: { type: Types.Text, initial: true, required: true, unique: true, index: true },
	description: { type: Types.Text, initial: true },
	type: { type: Types.Select, options: 'channel', initial: true },
	age: { type: Types.Text, initial: true },
	rating: { type: Types.Number, initial: true },
	channelNumber: { type: Types.Number, initial: true },
	embedCode: { type: Types.Textarea, initial: true },
	thumb: { type: Types.Text, initial: true },
	thumbnail: { type: Types.File, initial: true, thumb: true, storage: storage },
	categories: { type: Types.Relationship, initial: true, ref: 'Category', many: true },
});

Channel.schema.pre('save', function(next){
	this.uniqueId_1 = uuid.v4();
	if(this.thumbnail && this.thumbnail.filename)
		this.thumb = `${thumbUrl}${thumbPath}/${this.thumbnail.filename}`;
	next();
});

// Channel.defaultColumns = 'title, description, type, age, rating, channelNumber';

Channel.register();
