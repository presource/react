import { styleMedia } from './media';

describe('media conversion requirement', () => {
    it('should convert correctly', () => {
        const breakpoints = {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1300
        };

        const styled = styleMedia(breakpoints, {
            xs: {
                padding: 10
            },
            md: {
                padding: 20
            }
        });

        expect(styled).toStrictEqual({
            '@media (min-width: 0px)': { padding: 10 },
            '@media (min-width: 900px)': { padding: 20 }
        });
    });
});
