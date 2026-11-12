import { styleCombine } from './combine';

describe('combine style requirement', () => {
    it('should combine styled correctly', () => {
        const containsPaddingStyle = {
            padding: {
                xs: 5,
                lg: 10
            }
        };

        const containsMarginStyle = {
            margin: {
                xs: 10,
                lg: 5
            }
        };

        const containFontStyle = {
            fontSize: {
                md: 5,
                lg: 5
            }
        };

        const result = styleCombine(containsPaddingStyle, containsMarginStyle, containFontStyle);

        expect(result).toStrictEqual({
            xs: {
                padding: 5,
                margin: 10
            },
            lg: {
                padding: 10,
                margin: 5,
                fontSize: 5
            },
            sm: {},
            md: {
                fontSize: 5
            },
            xl: {}
        });
    });
});
