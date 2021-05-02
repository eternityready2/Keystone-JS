var keystone = require('keystone');
var Types = keystone.Field.Types;

var Category = new keystone.List('Category', { map: 'name' });

Category.add({
	name: { type: Types.Text, initial: true, required: true, unique: true, index: true },
	channels: { type: Types.Relationship, ref: 'Channel', many: true },
});

Category.defaultColumns = 'name, channels';
Category.register();
